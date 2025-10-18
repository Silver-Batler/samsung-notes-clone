pipeline {
    agent { label 'linux' }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_COMPOSE_PATH = '/usr/libexec/docker/cli-plugins/docker-compose' 
    }

    stages {
        stage('Login to Docker Hub') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        stage('Build') {
            steps {
                sh '${DOCKER_COMPOSE_PATH} build --no-cache backend'
                sh '${DOCKER_COMPOSE_PATH} build frontend'
            }
        }

        stage('Static Analysis') {
            steps {
                sh '${DOCKER_COMPOSE_PATH} run --rm backend python -m flake8 . --max-line-length=88'
                sh '${DOCKER_COMPOSE_PATH} run --rm backend python -m bandit -r .'
                sh '${DOCKER_COMPOSE_PATH} run --rm backend python -m black --check .'
            }
        }

        stage('Test') {
            steps {
                echo 'Running automated tests...'
                sh '${DOCKER_COMPOSE_PATH} run --rm backend sh -c "python -m pytest"'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh '${DOCKER_COMPOSE_PATH} push'
            }
        }
        
        stage('Deploy to Stage') {
            steps {
                sshagent(credentials: ['stage-vm-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no vboxuser@192.168.0.34 << 'EOSSH'
                        set -e
                        cd ~/samsung-notes-clone
                        git pull
                        /usr/libexec/docker/cli-plugins/docker-compose pull
                        /usr/libexec/docker/cli-plugins/docker-compose up -d --force-recreate
EOSSH
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
    }
}