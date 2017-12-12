/*
# Lendo sequencia de entradas
buffer = input()
input_sequence = buffer.split(' ')
for fsm_input in input_sequence:
    print(fsm_input)*/

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

  table = data.toString().split('\n');
  type = parseInt(table[0][0]);
  n_states = parseInt(table[1][0]);
  n_inputs = parseInt(table[1][2]);
  n_outputs = parseInt(table[1][4]);

  //Adicionando estados
  state_bytes = Math.ceil(Math.log(n_states, 2)) // Calcula numero minimo de bytes para codificar estados
  fsm_states = []
  for(i = 0; i < n_states; i++) {
  	fsm_states.push(String.fromCharCode(65+i))
  }

  //Adicionando transicoes
  fsm_transitions = []
  for(i = 0; i < (n_states*(2**n_inputs)); i++) { //Cada estado pode deve estar mapeado para todas as possibilidades de input
  	/*if(table.upper() != 'X'){
		fsm_transitions.push({ name: 
		table[i + 2][state_bytes*2 :state_bytes*2 + n_inputs*2], ,     
			from: 'solid',  
			to: 'liquid' });

		table[i][state_bytes*2 :state_bytes*2 + n_inputs*2], 
			chr(65 + int(buffer[ : state_bytes*2].replace(' ', ''), 2)), 
			chr(65 + int(buffer[state_bytes*2 + n_inputs*2 : state_bytes*4 + n_inputs*2].replace(' ', ''), 2))]);
  	}*/
  }

  console.log(fsm_states);

  var fsm = new StateMachine({
	init: 'solid',
	transitions: [
	  { name: 'melt',     from: 'solid',  to: 'liquid' },
	  { name: 'freeze',   from: 'liquid', to: 'solid'  },
	  { name: 'vaporize', from: 'liquid', to: 'gas'    },
	  { name: 'condense', from: 'gas',    to: 'liquid' }
	],
	methods: {
	  onMelt:     function() { console.log('I melted')    },
	  onFreeze:   function() { console.log('I froze')     },
	  onVaporize: function() { console.log('I vaporized') },
	  onCondense: function() { console.log('I condensed') }
	}
	});

	fs.writeFile('frame1.svg', (Viz(visualize(fsm))))
});