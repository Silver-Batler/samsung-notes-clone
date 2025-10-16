pipeline {
    agent { label 'linux' }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_COMPOSE_PATH = '/usr/libexec/docker/cli-plugins/docker-compose' 
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
                sh '${DOCKER_COMPOSE_PATH} build'
                sh '${DOCKER_COMPOSE_PATH} push'
            }
        }

        stage('Deploy to Stage') {
            steps {
                echo 'Deploying to Stage server...'
                sshagent(credentials: ['stage-vm-ssh-key']) {
                    // Используем синтаксис 'heredoc' для передачи многострочного скрипта по SSH.
                    // 'EOSSH' - это просто уникальный маркер, означающий "конец скрипта".
                    sh '''
                        ssh -o StrictHostKeyChecking=no vboxuser@192.168.0.34 << 'EOSSH'

                        # Эта команда говорит скрипту остановиться, если любая из команд завершится с ошибкой.
                        set -e
                        
                        echo "--- Connected to Stage VM ---"
                        
                        # Переходим в папку проекта на stage-vm
                        cd ~/samsung-notes-clone
                        echo "--- Changed directory to samsung-notes-clone ---"
                        
                        # Обновляем код из Git
                        git pull
                        echo "--- Git pull complete ---"
                        
                        # Скачиваем последние версии образов из Docker Hub
                        # Убедитесь, что этот путь правильный и для stage-vm
                        /usr/libexec/docker/cli-plugins/docker-compose pull
                        echo "--- Docker pull complete ---"
                        
                        # Перезапускаем приложение с новыми образами в фоновом режиме
                        /usr/libexec/docker/cli-plugins/docker-compose up -d --force-recreate
                        echo "--- Deployment to Stage complete! ---"
                        
EOSSH
                    '''
                }
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