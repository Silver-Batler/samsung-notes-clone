pipeline {
    agent any // Говорим Jenkins, что сборку можно выполнять на любом доступном агенте

    // Добавляем переменные окружения, чтобы не хранить логин в коде
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = DOCKERHUB_CREDENTIALS.username
    }

    stages {
        // --- Этап 1: Клонирование репозитория (делается автоматически) ---
        
        // --- Этап 2: Логин в Docker Hub ---
        stage('Login to Docker Hub') {
            steps {
                // Используем учетные данные, которые мы сохраним в Jenkins
                // DOCKERHUB_CREDENTIALS_PSW - это специальная переменная, которую Jenkins создает
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_USERNAME --password-stdin'
            }
        }

        // --- Этап 3: Сборка Docker-образов ---
        stage('Build images') {
            steps {
                echo 'Building Docker images...'
                // Используем docker compose для сборки
                sh 'docker compose build'
            }
        }

        // --- Этап 4: Загрузка образов в Docker Hub ---
        stage('Push images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                // Используем docker compose для загрузки
                sh 'docker compose push'
            }
        }
    }

    post {
        // --- Этап 5: Выход из Docker Hub (хорошая практика) ---
        always {
            stage('Logout from Docker Hub') {
                steps {
                    sh 'docker logout'
                }
            }
        }
    }
}