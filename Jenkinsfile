pipeline {
  agent any

  environment {
    DOCKERHUB     = credentials('dockerhub-creds')   // gives DOCKERHUB_USR / DOCKERHUB_PSW
    APP_SERVER_IP = credentials('app-server-ip')     // secret text
    IMAGE_TAG     = "${env.BUILD_NUMBER}"
  }

  triggers { pollSCM('H/5 * * * *') }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Backend tests') {
      steps {
        dir('backend') {
          sh '''
            docker run --rm --user $(id -u):$(id -g) -e HOME=/tmp \
              -v "$PWD":/app -w /app node:20-alpine sh -c "npm ci && npm test"
          '''
        }
      }
    }

    stage('Build images') {
      steps {
        sh '''
          docker build -t $DOCKERHUB_USR/vr-backend:$IMAGE_TAG  -t $DOCKERHUB_USR/vr-backend:latest  ./backend
          docker build -t $DOCKERHUB_USR/vr-frontend:$IMAGE_TAG -t $DOCKERHUB_USR/vr-frontend:latest ./frontend
        '''
      }
    }

    stage('Push images') {
      steps {
        sh '''
          echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin
          docker push $DOCKERHUB_USR/vr-backend:$IMAGE_TAG
          docker push $DOCKERHUB_USR/vr-backend:latest
          docker push $DOCKERHUB_USR/vr-frontend:$IMAGE_TAG
          docker push $DOCKERHUB_USR/vr-frontend:latest
        '''
      }
    }

    stage('Deploy with Ansible') {
      steps {
        withCredentials([file(credentialsId: 'app-ssh-key', variable: 'SSH_KEY')]) {
          sh '''
            ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook \
              -i "$APP_SERVER_IP," -u ubuntu --private-key "$SSH_KEY" \
              ansible/deploy.yml \
              -e target=all -e dockerhub_user=$DOCKERHUB_USR -e image_tag=$IMAGE_TAG
          '''
        }
      }
    }

    stage('Smoke test') {
      steps { sh 'curl -f http://$APP_SERVER_IP/api/health' }
    }
  }

  post {
    always { sh 'docker logout || true' }
  }
}
