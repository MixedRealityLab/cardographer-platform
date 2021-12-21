FROM ruby:buster

MAINTAINER chris.greenhalgh@nottingham.ac.uk

WORKDIR /root
RUN apt update
RUN gem install squib
RUN gem install rmagick

COPY . /root/work/
VOLUME /root/work/uploads
WORKDIR /root/work
EXPOSE 3001

CMD ["ruby", "worker.rb"]
