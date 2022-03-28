# "Simple" example - no images
# Expects columns: name, description, category
require 'squib'

optionsfile = ARGV.length>0 ? ARGV[0] : 'options.yml'
puts "using options file #{optionsfile}"
o = YAML.load(File.read(optionsfile))

data = Squib.csv file: o['csvfile']
n = data['name'].size

last_is_back = o['last_is_back'].to_s.downcase == "true"
# front cards
nf = last_is_back ? n-2 : n-1

# moo bleed size?!
Squib::Deck.new(cards: n, layout: o['layout'], width: o['width'], height: o['height'], dpi: o['dpi'].to_i) do
  background range: 0..nf, color: 'white'
  # back
  background range: -1, color: '#eee' if last_is_back
  # rectangle around card
  #rect
  #rect layout: 'cut' # cut line as defined by TheGameCrafter
  #rect layout: 'safe' # safe zone as defined by TheGameCrafter
  text range: 0..nf, str: data['name'], layout: 'title'
  text range: -1, str: data['name'], layout: 'back_title'
  text range: 0..nf, str: data['description'], layout: 'description'
  text range: 0..nf, str: data['category'], layout: 'lower_left'
  
  save_png dir: o['output'], prefix: o['png']['prefix'], count_format: o['png']['count_format']
  # moo trim is smaller than squib examples; A4 narrower than letter
  save_pdf dir: o['output'], file: o['pdf']['file'], trim: 23.5, height: 2200
  save_sheet dir: o['output'], prefix: o['sheet']['prefix'], count_format: o['sheet']['count_format'], rows: o['sheet']['rows'].to_i, columns: o['sheet']['columns'].to_i
end
