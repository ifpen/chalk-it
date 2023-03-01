function Vertex(name, successors) {
	this.name = name;
	this.successors = successors;
	this.reset();
}

Vertex.prototype = {
	reset: function() {
		this.index = -1;
		this.lowLink = -1;
		this.onStack = false;
		this.visited = false;
	}
};

function Graph() {
	this.vertices = {};
}

Graph.prototype = {
	add: function(key, descendants) {
		var self = this;

		descendants = Array.isArray(descendants) ? descendants : [ descendants ];

		var successors = descendants.map(function(key) {
			if (!self.vertices[key]) {
				self.vertices[key] = new Vertex(key, []);
			}
			return self.vertices[key];
		});

		if (!this.vertices[key]) {
			this.vertices[key] = new Vertex(key);
		}

		this.vertices[key].successors = successors.concat([]).reverse();
		return this;
	},

	reset: function() {
		var self = this;
		Object.keys(this.vertices).forEach(function(key) {
			self.vertices[key].reset();
		});
	},

	addAndVerify: function(key, dependencies) {
		this.add(key, dependencies);
		var cycles = this.getCycles();
		if (cycles.length) {
			var message = 'Detected ' + cycles.length + ' cycle' + (cycles.length === 1 ? '' : 's') + ':';
			message += '\n' + cycles.map(function(scc) {
				var names = scc.map(function(v) { return v.name; });
				return '  ' + names.join(' -> ') + ' -> ' + names[0];
			}).join('\n');

			var err = new Error(message);
			err.cycles = cycles;
			throw err;
		}

		return this;
	},

	dfs: function(key, visitor) {
		this.reset();
		var stack = [ this.vertices[key] ],
			v;
		while (v = stack.pop()) {
			if (v.visited) {
				continue;
			}

			//pre-order traversal
			visitor(v);
			v.visited = true;

			v.successors.forEach(function(w) {
				stack.push(w);
			});
		}
	},

	getDescendants: function(key) {
		var descendants = [],
			ignore = true;
		this.dfs(key, function(v) {
			if (ignore) {
				//ignore the first node
				ignore = false;
				return;
			}
			descendants.push(v.name);
		});
		return descendants;
	},

	hasCycle: function() {
		return this.getCycles().length > 0;
	},

	getStronglyConnectedComponents: function() {
		var self = this;

		var V = Object.keys(self.vertices).map(function(key) {
			self.vertices[key].reset();
			return self.vertices[key];
		});

		var index = 0,
			stack = [],
			components = [];

		function stronglyConnect(v) {
			v.index = index;
			v.lowLink = index;
			index++;
			stack.push(v);
			v.onStack = true;

			v.successors.forEach(function(w) {
				if (w.index < 0) {
					stronglyConnect(w);
					v.lowLink = Math.min(v.lowLink, w.lowLink);
				} else if (w.onStack) {
					v.lowLink = Math.min(v.lowLink, w.index);
				}
			});

			if (v.lowLink === v.index) {
				var scc = [];
				do {
					var w = stack.pop();
					w.onStack = false;
					scc.push(w);
				} while (w !== v);

				components.push(scc);
			}
		}

		V.forEach(function(v) {
			if (v.index < 0) {
				stronglyConnect(v);
			}
		});

		return components;
	},

	getCycles: function() {
		return this.getStronglyConnectedComponents().filter(function(scc) {
			return scc.length > 1;
		});
	},

	clone: function() {
		var graph = new Graph(),
			self = this;

		Object.keys(this.vertices).forEach(function(key) {
			var v = self.vertices[key];
			graph.add(v.name, v.successors.map(function(w) {
				return w.name;
			}));
		});

		return graph;
	},

	toDot: function() {
		var V = this.vertices,
		lines = [ 'digraph {' ];

		var cycles = this.getCycles();
		cycles.forEach(function(scc, i) {
			lines.push('  subgraph cluster' + i + ' {');
			lines.push('    color=red;');
			lines.push('    ' + scc.map(function(v) { return v.name; }).join('; ') + ';');
			lines.push('  }');
		});

		Object.keys(V).forEach(function(key) {
			var v = V[key];
			if (v.successors.length) {
				v.successors.forEach(function(w) {
					lines.push('  ' + v.name + ' -> ' + w.name);
				});
			}
		});

		lines.push('}');
		return lines.join('\n') + '\n';
	}
};

if (typeof module !== 'undefined') module.exports = Graph; // MBG fix for require

