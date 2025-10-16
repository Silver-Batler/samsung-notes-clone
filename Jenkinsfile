pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        // URL нашего репозитория
        GIT_REPO_URL = 'https://github.com/Silver-Batler/samsung-notes-clone.git'
    }

    stages {
        // ИЗМЕНЕНИЕ: Новый первый этап для клонирования
        stage('Clone Repository') {
            steps {
                echo "Cloning repository from ${GIT_REPO_URL}..."
                // Удаляем старую папку, если она есть, чтобы избежать конфликтов
                sh 'rm -rf samsung-notes-clone'
                // Клонируем репозиторий
                sh "git clone ${GIT_REPO_URL}"
            }
        }

        // Все последующие шаги теперь должны выполняться внутри скачанной папки
        stage('Build and Push') {
            steps {
                // ИЗМЕНЕНИЕ: Переходим в папку проекта перед выполнением команд
                dir('samsung-notes-clone') {
                    echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."
                    sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'

                    echo 'Building and pushing Docker images...'
                    sh 'docker-compose build'
                    sh 'docker-compose push'
                }
            }
        }
    }

    post {
        always {
            dir('samsung-notes-clone') { // Выполняем logout тоже из папки проекта
                echo 'Logging out from Docker Hub...'
                sh 'docker logout'
            }
        }
    }
}