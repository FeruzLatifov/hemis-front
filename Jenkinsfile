// CD pipeline (hemis-front) — HOZIRCHA faqat STAGING (test.hemis.uz).
// Oqim: main'ga merge → bitta image QURILADI (:<build>-<sha>) + Harbor push → staging deploy.
// PROD hali tayyor emas — keyin "Approve gate → prod" bosqichlari qo'shiladi (build-once, ayni image).
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
                    // --provenance=false --sbom=false: BuildKit default provenance attestation'ni O'CHIRADI.
                    //   Attestation bilan `docker build` OCI manifest-LIST (index) yasaydi; uni `docker push`
                    //   qilganda ma'lum Docker bug'i "no basic auth credentials" beradi — login to'g'ri va
                    //   akkaunt projectAdmin bo'lsa ham. O'chirilganda oddiy bitta manifest → push toza ishlaydi.
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
                        --wait --timeout 4m
                    kubectl rollout status deployment/${RELEASE_NAME} --namespace ${STAGING_NS} --timeout=3m
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
