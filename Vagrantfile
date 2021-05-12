# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-20.04"

  # config.vm.box_check_update = false

  # web server / dev
  config.vm.network "forwarded_port", guest: 3000, host: 3000
  config.vm.network "forwarded_port", guest: 10000, host: 10000
  # svelte websocket
  config.vm.network "forwarded_port", guest: 24678, host: 24678

  config.vm.provider "virtualbox" do |vb|
    # Display the VirtualBox GUI when booting the machine
    # vb.gui = true

    # Customize the amount of memory on the VM:
    vb.memory = "4096"
  end

  config.vm.provision "shell", inline: <<-SHELL
    # docker: https://docs.docker.com/engine/install/ubuntu/
    sudo apt-get update
    sudo apt-get install -y \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg-agent \
      software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    # NB sudo apt-key fingerprint 0EBFCD88 
    # should match 9DC8 5822 ...
    sudo add-apt-repository \
      "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) \
      stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    # docker-compose: https://docs.docker.com/compose/install/
    sudo curl -L "https://github.com/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  SHELL
end
