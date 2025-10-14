pipeline {
    // Агент, на котором будет выполняться сборка
    agent any

    // Переменные окружения, доступные на всех этапах
    environment {
        // Получаем объект с учетными данными из Jenkins
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_COMPOSE_PATH = '/usr/bin/docker-compose' 
    }

    stages {
        // Этап 1: Вход в Docker Hub
        stage('Login to Docker Hub') {
            steps {
                echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        // Этап 2: Сборка Docker-образов
        stage('Build images') {
            steps {
                echo 'Building Docker images...'
                // Используем docker compose для сборки
                sh '${DOCKER_COMPOSE_PATH} build'
            }
        }

        // Этап 3: Загрузка образов в Docker Hub
        stage('Push images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                // Используем docker compose для загрузки
                sh '${DOCKER_COMPOSE_PATH} push'
            }
        }
    }

    // Блок, который выполняется после всех этапов
    post {
        // Выполняется всегда, независимо от того, успешна сборка или нет
        always {
            // ИСПРАВЛЕНИЕ: Вместо stage() используем просто именованный шаг
            echo 'Logging out from Docker Hub...'
            sh 'docker logout'
        }
    }
}