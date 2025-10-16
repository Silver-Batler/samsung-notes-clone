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
                sh '${DOCKER_COMPOSE_PATH} run --rm backend python -m flake8 .'
                sh '${DOCKER_COMPOSE_PATH} run --rm backend python -m bandit -r .'
                sh '${DOCKER_COMPOSE_PATH} run --rm backend python -m black --check .'
            }
        }

        stage('Test') {
            steps {
                echo 'Running automated tests...'
                sh '''
                    ${DOCKER_COMPOSE_PATH} up -d db
                    # Wait for Postgres to be ready
                    for i in $(seq 1 30); do
                      ${DOCKER_COMPOSE_PATH} exec -T db pg_isready -h db -U user -d notes_db -p 5432 && break
                      sleep 2
                    done
                    ${DOCKER_COMPOSE_PATH} run --rm backend sh -lc "python -m pytest -q -vv --maxfail=1"
                '''
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
            sh '${DOCKER_COMPOSE_PATH} down -v || true'
            sh 'docker logout'
        }
    }
}