pipeline {
    // ИЗМЕНЕНИЕ: Указываем Jenkins использовать контейнер с Docker для всех шагов
    agent {
        docker {
            image 'docker:28.5.1'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Login to Docker Hub') {
            steps {
                echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."
                // Теперь эти команды выполняются внутри docker-контейнера, где они точно есть
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        stage('Build images') {
            steps {
                echo 'Building Docker images...'
                // ИЗМЕНЕНИЕ: Используем 'docker compose' (без дефиса), так как в образе docker:20 он есть
                sh 'docker compose build'
            }
        }

        stage('Push images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                // ИЗМЕНЕНИЕ: Используем 'docker compose' (без дефиса)
                sh 'docker compose push'
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