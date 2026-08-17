// CD pipeline (hemis-front) — main'ga merge → 1 marta BUILD → STAGING (test.hemis.uz)
//   → Approve gate → PROD (central.hemis.uz). Build-once: prodga aynan test qilingan IMAGE
//   chiqadi (qayta build YO'Q; API URL runtime config.js orqali per-namespace). Har deploy --atomic.
pipeline {
    agent any

    options {
        timeout(time: 90, unit: 'MINUTES')   // Approve gate kutishi (60m) + build/deploy
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        IMAGE_NAME    = 'harbor.e-edu.uz/central_hemis-front/hemis-front'
        RELEASE_NAME  = 'hemis-front'
        CHART_DIR     = 'helm/hemis-front'
        KUBECONFIG    = '/home/jenkins/.kube/config'
        STAGING_NS    = 'test-hemis'       // test.hemis.uz
        PROD_NS       = 'central-hemis'    // central.hemis.uz
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
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
                    // --provenance=false --sbom=false: BuildKit default provenance attestation'ni O'CHIRADI (Harbor push bug'i).
                    sh '''
                        echo "$HARBOR_PASS" | docker login harbor.e-edu.uz -u "$HARBOR_USER" --password-stdin
                        docker build --provenance=false --sbom=false -t ${IMAGE_NAME}:${IMAGE_TAG} .
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
                        --atomic --timeout 4m
                    kubectl rollout status deployment/${RELEASE_NAME} --namespace ${STAGING_NS} --timeout=3m
                '''
            }
        }

        stage('Approve -> Production') {
            steps {
                timeout(time: 60, unit: 'MINUTES') {
                    input message: "PRODUCTION (central.hemis.uz) ga ${IMAGE_NAME}:${env.IMAGE_TAG} deploy qilinsinmi? (staging test qilingan aynan shu image)", ok: 'Deploy PROD'
                }
            }
        }

        stage('Deploy -> Production (central.hemis.uz)') {
            steps {
                // Ayni IMAGE_TAG — qayta build YO'Q. API URL prod config (values/central.yaml -> config.js) orqali.
                sh '''
                    helm upgrade --install ${RELEASE_NAME} ${CHART_DIR} \
                        --namespace ${PROD_NS} --create-namespace \
                        -f ${CHART_DIR}/values.yaml -f ${CHART_DIR}/values/central.yaml \
                        --set image.repository=${IMAGE_NAME} \
                        --set image.tag=${IMAGE_TAG} \
                        --atomic --timeout 4m
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
