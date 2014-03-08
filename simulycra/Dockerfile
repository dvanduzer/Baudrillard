# Telehash simulator

FROM ubuntu

RUN apt-get update
RUN apt-get install -y python-software-properties python g++ make netcat-traditional
RUN add-apt-repository ppa:chris-lea/node.js
RUN apt-get update
RUN apt-get install -y nodejs

ADD . /telehash
RUN cd /telehash; npm install telehash optimist hiredis redis socket.io node-etcd
