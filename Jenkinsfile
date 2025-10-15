pipeline {
    // Говорим Jenkins выполнять сборку на агенте с меткой 'linux' 
    // (это наша test-vm, как мы настроили выше)
    agent {
        label 'linux'
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Login to Docker Hub') {
            steps {
                echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."
                // Выполняем команду прямо на test-vm
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        stage('Build and Push') {
            steps {
                echo 'Building and pushing Docker images...'
                // Выполняем команды прямо на test-vm
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