pipeline {
  agent {
    docker {
      image 'docker:27.3.1-cli' // или 'jenkins/agent:alpine-jdk17' + apk add docker-cli docker-cli-compose
      args  '-v /var/run/docker.sock:/var/run/docker.sock'
      reuseNode true
    }
  }
  environment {
    DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
  }
  stages {
    stage('Login') {
      steps {
        sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
      }
    }
    stage('Build') {
      steps {
        sh 'docker compose build'
      }
    }
    stage('Push') {
      steps {
        sh 'docker compose push'
      }
    }
  }
  post {
    always {
      sh 'docker logout || true'
    }
  }
}