require 'rmagick'
require 'fileutils'

# for example, convert all top-level .jpg files to cropped images in the scaled/ directory...

width = 825 # 22c @300dpi
height = 300 # 8c @300dpi
FileUtils.mkdir_p 'scaled'
Dir.glob('*.jpg') do |infile|
  outfile = "scaled/#{File.basename(infile,'.*')}.png"
  next if File.exists?(outfile) and File.mtime(outfile) > File.mtime(infile)
  puts "convert #{infile} -> #{outfile}"
  img = Magick::Image.read(infile).first
  img.format = "PNG"
  img.crop_resized!(width, height, Magick::CenterGravity)
  img.write(outfile)
  end
exit
