pipeline {
    // Этап 1: Определение "Агента"
    // Мы говорим Jenkins, что все шаги нужно выполнять внутри временного Docker-контейнера.
    agent {
        docker {
            // Используем официальный образ от Docker, в котором есть и 'docker', и 'docker-compose'.
            image 'docker/compose:1.29.2' 
            // Дополнительные аргументы для запуска контейнера-агента:
            // -v /var/run/docker.sock...: "пробрасываем" сокет, чтобы агент мог управлять Docker на хост-машине.
            // --user root: запускаем команды от имени root внутри агента, чтобы гарантированно иметь права на сокет.
            args '-v /var/run/docker.sock:/var/run/docker.sock --user root'
        }
    }

    // Этап 2: Определение переменных окружения
    environment {
        // Получаем логин и пароль/токен из хранилища Jenkins по их ID.
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    // Этап 3: Описание шагов конвейера
    stages {
        // Шаг 3.1: Вход в Docker Hub
        stage('Login to Docker Hub') {
            steps {
                echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."
                // Jenkins автоматически создает переменные _USR (логин) и _PSW (пароль).
                // Мы передаем пароль через стандартный ввод для безопасности.
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        // Шаг 3.2: Сборка образов
        stage('Build images') {
            steps {
                echo 'Building Docker images...'
                // Используем 'docker-compose' (с дефисом), так как в образе 'docker/compose:1.29.2' именно такая команда.
                sh 'docker-compose build'
            }
        }

        // Шаг 3.3: Загрузка образов в Docker Hub
        stage('Push images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh 'docker-compose push'
            }
        }
    }

    // Этап 4: Действия после выполнения всех шагов
    post {
        // 'always' означает, что этот блок выполнится всегда,
        // независимо от того, успешной была сборка или нет.
        always {
            echo 'Logging out from Docker Hub...'
            sh 'docker logout'
        }
    }
}