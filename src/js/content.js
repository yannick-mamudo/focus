import $ from 'jquery';
import url from 'url';
import template from 'lodash/string/template';
import filter from 'lodash/collection/filter';
import FocusContainer from './containers/FocusContainer';
import checkShouldBlock from './utils/checkShouldBlock';

let mounted = false;

const centerStyling = 'display: -webkit-box;display: -moz-box;display: box;display: -webkit-flex;display: -moz-flex;\
    display: -ms-flexbox;display: flex;-webkit-box-align: center;-moz-box-align: center;box-align: center;\
    -webkit-align-items: center;-moz-align-items: center; -ms-align-items: center;-o-align-items: center;\
    align-items: center;-ms-flex-align: center;'

const mountTemplate = template(' \
	<div id="content-container" style="height:100%;text-align:center;' + centerStyling + '"> \
		<div style="width:100%;"> \
			<div id="content-time" style="font-size: 4em; margin-bottom:20px;"><%= minutes %> : <%= seconds%></div> \
			<div id="content-todo"> \
				<ul> \
					<% todos.map(function (todo) {%> \
						<li style="margin:10px 0px;font-size:14px;"><%= todo.todo %></li> \
					<% }); %> \
				</ul> \
			</div> \
		</div> \
	</div> \
');

function mountOrNot(siteChecker) {
	return (siteList, date, state) => {
		const shouldBlockSite = siteChecker(siteList);

		if (date && date < Date.now()) {
			if (shouldBlockSite && !mounted) {
				mountBlocker(state);	
			}
		} else if (mounted) {
			dismountBlocker();
		}
	};
}

const urlData = url.parse(window.location.href);
const checkShouldMountOrNot = mountOrNot(checkShouldBlock(urlData));

chrome.storage.sync.get('state', data => {
	const { websites, timer } = data.state;
	
	checkShouldMountOrNot(websites.websites, timer.date, data.state);

	chrome.extension.onMessage.addListener(function(msg) {	// Listen for results
		if (msg.type === 'STATE_UPDATE') {
			const { websites, timer } = msg.data;
			checkShouldMountOrNot(websites.websites, timer.date, msg.data);
			if (mounted) {
				updateBlocker(msg.data);	
			}
		}
	});
});

function mountBlocker(state) {
	// set up mount point
	const body = document.body ? document.body : document.createElement('body');
	const mountPoint = document.createElement('div');
	mountPoint.id = 'mount-point-focus';
	mountPoint.style.cssText = ' \
		color:#ea1c0d; position:fixed; width:100%; height:100%; \
		background-color:#f99d97; top:0px; left:0px; z-index:10000;';
	body.appendChild(mountPoint);
	document.getElementsByTagName('html')[0].appendChild(body);
	
	updateBlocker(state);

	mounted = true;
}

function dismountBlocker() {
	// const body = document.body ? document.body : document.createElement('body');
	const mountPoint = document.getElementById('mount-point-focus');

	mountPoint.parentNode.removeChild(mountPoint);
	mounted = false;
}

function updateBlocker(data) {
	const {minutes, seconds} = data.timer;
	const todos = filter(data.todos.todos, todo => todo.workingOn );
	$('#mount-point-focus').html(mountTemplate({minutes, seconds, todos}));
}