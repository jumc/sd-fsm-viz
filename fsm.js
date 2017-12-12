var StateMachine = require('javascript-state-machine');
var visualize = require('javascript-state-machine/lib/visualize');
var Viz = require('viz.js');
var fs = require('fs');

if (process.argv.length < 4) {
  console.log('Usage: node ' + process.argv[1] + 
  	' table_file' + ' input_file');
  process.exit(1);
}

table_file = process.argv[2];
input_file = process.argv[3];


fs.readFile(table_file, function(err, data) {
  if (err) 
  	throw err;

  table = data.toString().replace(/\r/g,'').split('\n');
  type = parseInt(table[0][0]);
  properties = table[1].split(' ')
  n_states = parseInt(properties[0]);
  n_inputs = parseInt(properties[1]);
  n_outputs = parseInt(properties[2]);
  state_bytes = Math.ceil(Math.log(n_states, 2)) // Calcula numero minimo de bytes para codificar estados

  //Adicionando transicoes
  fsm_transitions = []
  for(i = 0; i < (n_states*(2**n_inputs)); i++) { //Cada estado pode deve estar mapeado para todas as possibilidades de input
  	line  = table[i + 2].replace(/\s/g,'');
  	if(line[line.length-2] != 'X'){ //
		fsm_transitions.push({ 
			name: line.slice(state_bytes, state_bytes + n_inputs) + ' / '
				+ line.slice(2*state_bytes + n_inputs, line.length),     
			from: line.slice(0, state_bytes),  
			to: line.slice(state_bytes + n_inputs, 2*state_bytes + n_inputs)});
  	}
  }

  var fsm = new StateMachine({
	init: table[2].replace(/\s/g,'').slice(0, state_bytes),
	transitions: fsm_transitions,
	methods: {
	  onMelt:     function() { console.log('I melted')    },
	  onFreeze:   function() { console.log('I froze')     },
	  onVaporize: function() { console.log('I vaporized') },
	  onCondense: function() { console.log('I condensed') }
	}
	});


  	console.log(fsm_transitions);
  	/*
# Lendo sequencia de entradas
buffer = input()
input_sequence = buffer.split(' ')
for fsm_input in input_sequence:
    print(fsm_input)*/

	fs.writeFile('frame1.svg', (Viz(visualize(fsm))))
});