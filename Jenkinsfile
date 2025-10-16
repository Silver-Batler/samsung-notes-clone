pipeline {
    agent { label 'linux' }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        // ИЗМЕНЕНИЕ: Указываем точный путь здесь
        DOCKER_COMPOSE_PATH = '/usr/bin/docker-compose' 
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
                // ИЗМЕНЕНИЕ: Используем переменную с полным путем
                sh '${DOCKER_COMPOSE_PATH} build'
                sh '${DOCKER_COMPOSE_PATH} push'
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