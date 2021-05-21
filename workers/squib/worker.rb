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
    f = IO.popen(["ruby","deck.rb",:err=>[:child, :out]])
    output = f.readlines
    f.close
    puts output.join("")
    puts "done, status #{$? >> 8}"
    connection.write output
    connection.write "<DONE\n" if ( $? >> 8 ) == 0
    connection.write "<ERROR #{$? >> 8}\n" if ( $? >> 8 ) != 0
  else
    puts "unknown command: #{command}"
    connection.write "<ERROR: unknown command\n"
  end
  connection.write "<CLOSING\n"
  puts "closing connection"
  connection.close 
end

