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

        // Этап 2: Сборка образов
        stage('Build') {
            steps {
                echo 'Building Docker images...'
                // Принудительно пересобираем backend, чтобы установить flake8 и bandit
                sh '${DOCKER_COMPOSE_PATH} build --no-cache backend'
                // frontend собираем как обычно
                sh '${DOCKER_COMPOSE_PATH} build frontend'
            }
        }

        // Этап 3: Статический анализ
        stage('Static Analysis') {
            steps {
                echo 'Running static analysis on backend...'
                // Теперь эти команды запускаются на свежесобранном образе, где есть flake8 и bandit
                sh '${DOCKER_COMPOSE_PATH} run --rm backend flake8 .'
                sh '${DOCKER_COMPOSE_PATH} run --rm backend bandit -r .'
            }
        }

        // Этап 4: Загрузка образов
        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh '${DOCKER_COMPOSE_PATH} push'
            }
        }
        
        // Этап 5: Развертывание
        stage('Deploy to Stage') {
            steps {
                echo 'Deploying to Stage server...'
                sshagent(credentials: ['stage-vm-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no vboxuser@192.168.0.34 << 'EOSSH'
                        set -e
                        echo "--- Connected to Stage VM ---"
                        cd ~/samsung-notes-clone
                        git pull
                        /usr/libexec/docker/cli-plugins/docker-compose pull
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