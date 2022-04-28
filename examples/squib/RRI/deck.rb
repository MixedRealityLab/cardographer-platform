# Sigle image (PNG) on front.
# input 'name', 'image' (no folder/extension)
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
  background range: 0..nf, color: data['colour']
  # white box for top content
  rect range: 0..nf, layout: 'top_box', stroke_color: '#0000', fill_color: 'white'
  # slightly transparent for bottom content
  rect range: 0..nf, layout: 'bottom_box', stroke_color: '#0000', fill_color: '#ffffffd0'
  # back
  background range: -1, color: data['colour'] if last_is_back

  # rectangle around card
  rect range: 0..nf, layout: 'border', stroke_width: '2c', stroke_color: data['colour'] # cut line as defined by TheGameCrafter

  text range: 0..nf, str: data['name'], layout: 'title'
  # back title
  text range: -1, str: data['name'], layout: 'back_title'
  formatted_descriptions = data['description'].map!{|x| x.is_a?(String) ? x.split('? ').join("?\r\n") : x}
  text range: 0..nf, str: formatted_descriptions, layout: 'description', spacing: 3
  text range: 0..nf, str: 'Example actions:', layout: 'action_title'
  formatted_actions = data['action'].map!{|x| x.is_a?(String) ? "\u2022 "+x.split(';').join("\r\n\u2022") : x}
  text range: 0..nf, str: formatted_actions, layout: 'action', markup: true, spacing: 3
  text range: 0..nf, str: data['category'], layout: 'lower_left'
  text range: 0..nf, str: data['aspect'], layout: 'lower_right'

  save_png dir: o['output'], prefix: o['png']['prefix'], count_format: o['png']['count_format'], trim: o['png']['trim']
  # A4 narrower than letter
  save_pdf dir: o['output'], file: o['pdf']['file'], trim: o['pdf']['trim'], height: 2200
  save_sheet dir: o['output'], prefix: o['sheet']['prefix'], count_format: o['sheet']['count_format'], trim: o['sheet']['trim'], rows: o['sheet']['rows'].to_i, columns: o['sheet']['columns'].to_i
end
