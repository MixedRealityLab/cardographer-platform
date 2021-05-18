require 'socket'

server = TCPServer.open('0.0.0.0', 3001)


while connection = server.accept
  request = connection.gets
  command, path = request.split(' ')
  case command
  when "rundeck/1"
    output = `ruby ./uploads/#{path}/deck.rb`
    connection.write output
  else
    connection.write 'ERROR: unknown command'
  end
  connection.close 
end

