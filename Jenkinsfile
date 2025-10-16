pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Login to Docker Hub') {
            steps {
                echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        stage('Build and Push') {
            steps {
                echo 'Building and pushing Docker images...'
                // Команды выполняются в корне проекта, где лежит docker-compose.yaml
                sh 'docker-compose build'
                sh 'docker-compose push'
            }
        }
    }

    post {
        always {
            echo 'Logging out from Docker Hub...'
            sh 'docker logout'
        }
    }
}