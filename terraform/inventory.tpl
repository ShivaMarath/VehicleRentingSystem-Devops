[app]
${app_ip}

[jenkins]
${jenkins_ip}

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=${private_key_path}
ansible_python_interpreter=/usr/bin/python3
