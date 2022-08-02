# RRI cards with 'name', 'description' and list of 'action's (semi-colon-separated), 'version',
# categorised by 'category' and 'aspect'.
# Two different versions, identified by 'layers' = 'face'/'back' and 'altface'/'altback'
# - the alt ones are simpler, with just title
# input 'name', 'image' (no folder/extension)
require 'squib'

optionsfile = ARGV.length>0 ? ARGV[0] : 'options.yml'
puts "using options file #{optionsfile}"
o = YAML.load(File.read(optionsfile))

data = Squib.csv file: o['csvfile']
n = data['name'].size

last_is_back = o['last_is_back'].to_s.downcase == "true"
even_is_back = o['even_is_back'].to_s.downcase == "true"
puts "last_is_back = #{last_is_back}, even_is_back = #{even_is_back}"

# using layers for face/back...
all_cards = (0..n-1).to_a
# layers value can be comma-separated
card_layers = data['layers'].map{|l| l.is_a?(String) ? l.split(',') : []}
puts "Note, found layers: #{card_layers.flatten.uniq} (expecting face, back, altface, altback"

face_cards = all_cards.select{|ix| card_layers[ix].include?('face')}
back_cards = all_cards.select{|ix| card_layers[ix].include?('back')}
altface_cards = all_cards.select{|ix| card_layers[ix].include?('altface')}
altback_cards = all_cards.select{|ix| card_layers[ix].include?('altback')}

# moo bleed size?!
Squib::Deck.new(cards: n, layout: o['layout'], width: o['width'], height: o['height'], dpi: o['dpi'].to_i) do
  # all cards! - back
  background range: all_cards, color: data['colour']

  # face cards
  # white box for top content
  rect range: face_cards, layout: 'top_box', stroke_color: '#0000', fill_color: 'white'
  # slightly transparent for bottom content
  rect range: face_cards, layout: 'bottom_box', stroke_color: '#0000', fill_color: '#ffffffd0'
  # rectangle around card
  rect range: face_cards, layout: 'border', stroke_width: '2c', stroke_color: data['colour'] # cut line as defined by TheGameCrafter
  text range: face_cards, str: data['name'], layout: 'title'
  text range: face_cards, str: data['version'], layout: 'version'

  formatted_descriptions = data['description'].map!{|x| x.is_a?(String) ? x.split('? ').join("?\r\n") : x}
  text range: face_cards, str: formatted_descriptions, layout: 'description', spacing: 3
  text range: face_cards, str: 'Example actions:', layout: 'action_title'
  formatted_actions = data['action'].map!{|x| x.is_a?(String) ? "\u2022 "+x.split(';').join("\r\n\u2022") : x}
  text range: face_cards, str: formatted_actions, layout: 'action', markup: true, spacing: 3
  text range: face_cards, str: data['category'], layout: 'lower_left'
  text range: face_cards, str: data['aspect'], layout: 'lower_right'

  # alt face
  rect range: altface_cards, layout: 'alt_box', stroke_color: '#0000', fill_color: 'white'
  text range: altface_cards, str: data['name'], layout: 'alt_title'
  text range: altface_cards, str: data['version'], layout: 'alt_version'

  # altback cards - with extra pale alt_box (should also have layers 'back')
  rect range: altback_cards, layout: 'alt_box', stroke_color: '#0000', fill_color: '#ffffffd0'

  # back cards
  text range: back_cards, str: data['name'], layout: 'back_deck_title'
  circle range: back_cards, layout: 'back_cutout', stroke_color: '#0000', fill_color: '#ffffffd0'
  # back title
  text range: back_cards, str: data['category'], layout: 'back_title'
  text range: back_cards, str: data['version'], layout: 'back_version'

  save_png dir: o['output'], prefix: o['png']['prefix'], count_format: o['png']['count_format'], trim: o['png']['trim'] if !even_is_back
  save_sheet dir: o['output'], prefix: o['sheet']['prefix'], count_format: o['sheet']['count_format'], trim: o['sheet']['trim'], rows: o['sheet']['rows'].to_i, columns: o['sheet']['columns'].to_i if !even_is_back
  # using a sprue
  save_pdf dir: o['output'], file: o['pdf']['file'], trim: o['pdf']['trim'], sprue: o['pdf']['sprue'] if even_is_back
end
