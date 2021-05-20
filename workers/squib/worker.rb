require 'socket'

server = TCPServer.open('0.0.0.0', 3001)

$stdout.sync = true

workdir = Dir.pwd
puts "workdir #{workdir}"
while connection = server.accept
  Dir.chdir( workdir )
  puts "accepted new connection"
  connection.write "<CONNECTED 1\n"
  request = connection.gets
  command, path = request.split(' ')
  Dir.chdir ( "#{workdir}/uploads/#{path}" )
  case command
  when "rundeck/1"
    puts "do rundeck/1 in #{path}"
    connection.write "<RUNNING\n"
    output = `ruby deck.rb`
    puts output
    puts "done"
    connection.write output
    connection.write "<DONE\n"
  else
    puts "unknown command: #{command}"
    connection.write "<ERROR: unknown command\n"
  end
  connection.write "<CLOSING\n"
  puts "closing connection"
  connection.close 
end

