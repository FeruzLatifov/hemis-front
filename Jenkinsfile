// Professional Continuous Delivery pipeline (hemis-front)
// Oqim: bitta image QURILADI → staging (test.hemis.uz)'ga deploy → inson TASDIQLAYDI →
//        AYNI image prod'ga (qayta build YO'Q). "build once, promote the same artifact".
// Trigger: main'ga har merge (GitHub webhook). Feature branch → PR → main.
pipeline {
    agent any

    options {
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        IMAGE_NAME    = 'harbor.e-edu.uz/central_hemis-front/hemis-front'
        RELEASE_NAME  = 'hemis-front'
        CHART_DIR     = 'helm/hemis-front'
        KUBECONFIG    = '/home/jenkins/.kube/config'
        STAGING_NS    = 'test-hemis'      // test.hemis.uz
        PROD_NS       = 'new-ministry'    // asosiy domen
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Immutable tag = build raqami + git SHA. AYNI shu tag staging va prod'da ishlatiladi.
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()}"
                    echo "Artifact: ${IMAGE_NAME}:${env.IMAGE_TAG}"
                }
            }
        }

        stage('Build & Push (1 marta)') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'harbor-central-hemis',
                    usernameVariable: 'HARBOR_USER',
                    passwordVariable: 'HARBOR_PASS'
                )]) {
                    sh '''
                        echo "$HARBOR_PASS" | docker login harbor.e-edu.uz -u "$HARBOR_USER" --password-stdin
                        docker build --no-cache -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker logout harbor.e-edu.uz
                    '''
                }
            }
        }

        stage('Deploy -> Staging (test.hemis.uz)') {
            steps {
                sh '''
                    helm upgrade --install ${RELEASE_NAME} ${CHART_DIR} \
                        --namespace ${STAGING_NS} --create-namespace \
                        -f ${CHART_DIR}/values.yaml -f ${CHART_DIR}/values/test-hemis.yaml \
                        --set image.repository=${IMAGE_NAME} \
                        --set image.tag=${IMAGE_TAG} \
                        --wait --timeout 4m
                    kubectl rollout status deployment/${RELEASE_NAME} --namespace ${STAGING_NS} --timeout=3m
                '''
            }
        }

        stage('Approve -> Production') {
            steps {
                timeout(time: 1, unit: 'DAYS') {
                    input(
                        message: "Staging (test.hemis.uz) tekshirildi. Prod'ga (${PROD_NS}) AYNI image chiqaraymi?",
                        ok: "Prod'ga chiqar"
                    )
                }
            }
        }

        stage('Deploy -> Production (AYNI image)') {
            steps {
                sh '''
                    helm upgrade --install ${RELEASE_NAME} ${CHART_DIR} \
                        --namespace ${PROD_NS} --create-namespace \
                        -f ${CHART_DIR}/values.yaml \
                        --set image.repository=${IMAGE_NAME} \
                        --set image.tag=${IMAGE_TAG} \
                        --wait --timeout 4m
                    kubectl rollout status deployment/${RELEASE_NAME} --namespace ${PROD_NS} --timeout=3m
                '''
            }
        }
    }

    post {
        always {
            sh 'docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true'
            cleanWs()
        }
    }
}
