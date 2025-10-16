pipeline {
    agent { label 'linux' }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        // ПУТЬ К DOCKER-COMPOSE НА TEST-VM (где работает Jenkins)
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

        // --- НОВЫЙ ЭТАП ---
        stage('Deploy to Stage') {
            steps {
                echo 'Deploying to Stage server...'
                // Оборачиваем SSH-команды в sshagent, используя созданные credentials
                sshagent(credentials: ['stage-vm-ssh-key']) {
                    // Команды, которые будут выполнены на stage-vm
                    // !! ЗАМЕНИТЕ 192.168.0.34 НА IP-АДРЕС ВАШЕЙ STAGE-VM !!
                    sh '''
                        ssh -o StrictHostKeyChecking=no vboxuser@192.168.0.34 << 'ENDSSH'
                        
                        echo "--- Connected to Stage VM ---"
                        
                        # Переходим в папку проекта на stage-vm
                        cd ~/samsung-notes-clone
                        
                        # Обновляем код из Git (на всякий случай, если изменился docker-compose.yaml)
                        git pull
                        
                        # Скачиваем последние версии образов из Docker Hub
                        # !! УКАЖИТЕ ЗДЕСЬ ПУТЬ К DOCKER-COMPOSE НА STAGE-VM !!
                        # (скорее всего, он такой же)
                        /usr/libexec/docker/cli-plugins/docker-compose pull
                        
                        # Перезапускаем приложение с новыми образами в фоновом режиме
                        /usr/libexec/docker/cli-plugins/docker-compose up -d --force-recreate
                        
                        echo "--- Deployment to Stage complete! ---"
                        
                        ENDSSH
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