var StateMachine = require('javascript-state-machine');
var visualize = require('javascript-state-machine/lib/visualize');
var Viz = require('viz.js');
var fs = require('fs');
var childProcess = require('child_process');

if (process.argv.length < 4) {
	console.log('Usage: node ' + process.argv[1] + ' table_file' + ' input_file');
	process.exit(1);
}
table_file = process.argv[2];
input_file = process.argv[3];

function runScript(scriptPath, callback) {
	var invoked = false;
    var process = childProcess.fork(scriptPath);
	process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });
	process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

fs.readFile(table_file, function(err, table_data) {
	if (err) 
		throw err;
	
	// Configuracoes gerais
	table = table_data.toString().replace(/\r/g,'').split('\n');
	lines = [];
	for(i = 0; i < table.length - 2; i++) { 
		lines[i] = table[i + 2].replace(/\s/g,'');
	}

	type = parseInt(table[0][0]);
	properties = table[1].split(' ')
	n_states = parseInt(properties[0]);
	n_inputs = parseInt(properties[1]);
	n_outputs = parseInt(properties[2]);
	state_bytes = Math.ceil(Math.log(n_states, 2)) // Calcula numero minimo de bytes para codificar estados

  	fs.readFile(input_file, function(err, input_data) {
  		if (err) 
  			throw err;

	  	input = input_data.toString().replace(/\r/g,'').split(' ');

	  	if(type == 0){
	  		initial_state = table[2].replace(/\s/g,'').slice(0, state_bytes).replace(/0/g,'o').replace(/1/g,'l');
	  	}
	  	else{
	  		initial_state = table[2].replace(/\s/g,'').slice(0, state_bytes).replace(/0/g,'o').replace(/1/g,'l') + 'xo';
	  	}

	  	// Criando script que salva frames
	  	var out = fs.createWriteStream('frameCreator.js', { encoding: "utf8" });
    	str = 'var StateMachine = require(\'javascript-state-machine\');\n' +
			'var visualize = require(\'javascript-state-machine/lib/visualize\');\n' +
			'var Viz = require(\'viz.js\');\n' +
			'var fs = require(\'fs\');\n\n' +
			'current_state = \'' + initial_state + '\';\n' +
			'lines = ' + JSON.stringify(lines).replace(/0/g,'o').replace(/1/g,'l') + ';\n\n';

		transitions = [];
		for(j = 0; j < input.length; j++) {
			if(type == 0){
		  		transitions.push((input[j] + 'xo').replace(/0/g,'o').replace(/1/g,'l')); // Pensar em como fazer
		  	}
		  	else{
		  		transitions.push(input[j].replace(/0/g,'o').replace(/1/g,'l'));
		  	}
			str += 'current_transition = \'' + transitions[j] + '\';\n' +
			'fsm_transitions = [];\n' +
			'for(i = 0; i < ' + lines.length + '; i++) {\n' + 
				'if(lines[i][lines[i].length-2] != \'X\'){\n' +						
					'dot_content = {};\n';

			if(type == 0){
				str += 'if(lines[i].slice(' + state_bytes + ', ' + (state_bytes + n_inputs) + ') + \'x\' + lines[i].slice(' + (2*state_bytes + n_inputs) + ', lines[i].length) == current_transition && lines[i].slice(0, ' + state_bytes + ') == current_state)\n' +
						'dot_content = {color: "red"};\n' +
				'fsm_transitions.push({\n' + 
					'name: lines[i].slice(' + state_bytes + ', ' + (state_bytes + n_inputs) + ') + \'x\' + lines[i].slice(' + (2*state_bytes + n_inputs) + ', lines[i].length),\n' +    
					'from: lines[i].slice(0, ' + state_bytes + '),\n' +  
					'to: lines[i].slice(' + (state_bytes + n_inputs) + ', ' + (2*state_bytes + n_inputs) + '),\n' +
					'dot: dot_content});\n' +
					'} }\n';
			}else { 
				str += 'if(lines[i].slice(' + state_bytes + ', ' + (state_bytes + n_inputs) + ') == current_transition &&  lines[i].slice(0, ' + state_bytes + ') + \'xo\' == current_state)\n' +
						'dot_content = {color: "red"};\n' +
				'fsm_transitions.push({\n' + 
					'name: lines[i].slice(' + state_bytes + ', ' + (state_bytes + n_inputs) + '),\n' +    
					'from: lines[i].slice(0, ' + state_bytes + ') + \'xo\',\n' +  
					'to: lines[i].slice(' + (state_bytes + n_inputs) + ', ' + (2*state_bytes + n_inputs) + ')+ \'x\' + lines[i].slice(' + (2*state_bytes + n_inputs) + ', lines[i].length),\n' +
					'dot: dot_content});\n' +
					'dot_content = {};\n' +
					'if(lines[i].slice(' + state_bytes + ', ' + (state_bytes + n_inputs) + ') == current_transition &&  lines[i].slice(0, ' + state_bytes + ') + \'xl\' == current_state)\n' +
						'dot_content = {color: "red"};\n' +
					'fsm_transitions.push({\n' + 
					'name: lines[i].slice(' + state_bytes + ', ' + (state_bytes + n_inputs) + '),\n' +     
					'from: lines[i].slice(0, ' + state_bytes + ') + \'xl\',\n' +  
					'to: lines[i].slice(' + (state_bytes + n_inputs) + ', ' + (2*state_bytes + n_inputs) + ') + \'x\' + lines[i].slice(' + (2*state_bytes + n_inputs) + ', lines[i].length),\n' +
					'dot: dot_content});}}\n';
			}
		  	str += 'var fsm = new StateMachine({init : \'' + initial_state + '\', transitions: fsm_transitions});\n' +
			'fs.writeFile(\'frame' + j + '.svg\', (Viz(visualize(fsm))));\n';
			for(k = 0; k < transitions.length; k++)
				str += 'fsm.' + transitions[k] + '();\n';
			str += 'current_state = fsm.state;\n'+
			'console.log(current_state);\n\n';			
    	}
  		out.write(str);
    	out.end();

		runScript('./frameCreator.js', function (err) {
		    if (err) throw err;
		});
	});
});