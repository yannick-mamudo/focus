import React, { Component } from 'react';
import classnames from 'classnames';
import wrapActionsWithMessanger from '../utils/wrapActionsWithMessanger';
import Register from '../components/Register';
import Login from '../components/Login';
import MinutesAndSeconds from '../components/MinutesAndSeconds';
import WebsiteForm from '../components/WebsiteForm';
import WebsiteList from '../components/WebsiteList';
import SessionsList from '../components/SessionsList';
import Todos from '../components/Todos';

const actions = wrapActionsWithMessanger([
	'clearTimer',
	'countDown',
	'addWebsite',
	'toggleShowSites',
	'removeWebsite',
	'addTodo',
	'toggleTodoCompletion',
	'removeTodo',
	'toggleTodoEdit',
	'editTodo',
	'toggleTodoWorking',
	'register',
	'login',
	'logout',
]);

let oldState = {};

export default class FocusContainer extends Component {
	constructor(props) {
		super(props);
		oldState = props.state;
		this.state = props.state;
	}

	updateState(newState) {
		const { seconds, minutes } = newState.timer;
		if (seconds && seconds !== oldState.timer.seconds) {
			let stateNewTime = oldState;
			stateNewTime.timer.seconds = seconds;
			stateNewTime.timer.minutes = minutes;
			this.setState(stateNewTime);
			oldState = stateNewTime;
		} else {
			this.setState(newState);
			oldState = newState;
		}
	}

	componentWillMount() {
		const { updateState } = this;
		chrome.extension.onMessage.addListener((req, sender, sendRes) => {
			if (req.type === 'STATE_UPDATE' && req.dest !== 'BLOCKER') {
				updateState.call(this, req.data);
			}
			return true;
		});
	}

	render() {
		const { user } = this.state;
		if (user.token === '') {
			const { register, login } = actions;
			return (
				<div>
					<Register register={register} />
					<Login login={login} />
				</div>
			)
		} else {
			const { 
				countDown, addWebsite, removeWebsite, addTodo, toggleTodoCompletion,
				toggleTodoWorking, removeTodo, toggleShowSites, toggleTodoEdit,
				editTodo, logout
			} = actions;
			const { 
				date, minutes, seconds, duration, sessions, ampm, sound,
			} = this.state.timer;
			const { websites, showSites } = this.state.websites;
			const { todos } = this.state.todos;
			
			return (
				<section 
					id="focus-container" 
					className={classnames({focusing: !!minutes})}>

					<div id="header">
						<div id="main-action" className={classnames({blurring: showSites})}>
							{
								minutes
								? <MinutesAndSeconds minutes={minutes} seconds={seconds} />
								: (
									<button 
										className="focus-button" 
										onClick={() => countDown(Date.now(), duration, sound)}>
										start focusing
									</button>
								)
							}
						</div>
						<WebsiteList 
							websites={websites}
							showSites={showSites}
							toggleShowSites={toggleShowSites}
							removeWebsite={removeWebsite} 
							disabled={minutes ? true : false} />
						<div onClick={() => {logout()}}>LOGOUT</div>
					</div>

					<div id="spread" className={classnames({blurring: showSites})}>
						<Todos 
							addTodo={addTodo} 
							toggleTodoWorking={toggleTodoWorking}
							toggleTodoCompletion={toggleTodoCompletion} 
							removeTodo={removeTodo}
							todos={todos}
							toggleTodoEdit={toggleTodoEdit}
							editTodo={editTodo} />
						<SessionsList 
							sessions={sessions} 
							ampm={ampm} 
							todos={todos} />
					</div>

				</section>
			);			
		}
	}
}
