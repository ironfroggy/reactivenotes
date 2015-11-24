var React = require('react');

var App = React.createClass({
	render: function() {
		var greet = (name)=>`Hello, ${name}!`;
		return (
			<h1>{greet("World")}</h1>
		);
	}

});

module.exports = App;
