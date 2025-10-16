pipeline {
    // Jenkins теперь самодостаточен, используем простой агент
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Login to Docker Hub') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        stage('Build and Push') {
            steps {
                // Используем современный синтаксис, так как мы установили docker-compose-plugin
                sh 'docker compose build'
                sh 'docker compose push'
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
    }
}