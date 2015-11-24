import React from 'react';

class App extends React.Component {
	render() {
		var greet = (name)=>`Hello, ${name}!`;
		return (
			<h1>{greet("World")}</h1>
		)
	}
}

export default App;
