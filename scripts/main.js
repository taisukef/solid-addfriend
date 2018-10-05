const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');

// Log the user in and out on click
const popupUri = 'popup.html';
$('#login  button').click(() => solid.auth.popupLogin({ popupUri }));
$('#logout button').click(() => solid.auth.logout());

// Update components to match the user's login status
solid.auth.trackSession(session => {
	const loggedIn = !!session;
	$('#login').toggle(!loggedIn);
	$('#logout').toggle(loggedIn);
	if (loggedIn) {
		$('#user').text(session.webId);
		// Use the user's WebID as default profile
		if (!$('#profile').val())
			$('#profile').val(session.webId);
	}
});

var display = function() {
	solid.auth.trackSession(async session => {
		var hash = document.location.hash;
		if (hash.length > 1) {
			var uri = hash.substring(1);
			$('#friend').val(uri);
		}
		
		if (!session)
			return;
		
		const person = session.webId;
		console.log(person);
		
		// Set up a local data store and associated data fetcher
		const store = $rdf.graph();
		const fetcher = new $rdf.Fetcher(store);
		const updater = new $rdf.UpdateManager(store);
	
		var s = $('#link').val();
		console.log(s);
		s = s.replace("[your WebID]", person);
		$('#link').val(s);
		
		// Load the person's data into the store
		await fetcher.load(person);
		// Display their details
		const fullName = store.any($rdf.sym(person), FOAF('name'));
		$('#fullName').text(fullName && fullName.value);
		
		// Display their note (added by taisukef)
		const note = store.any($rdf.sym(person), VCARD('note'));
		$('#note').text(note && note.value);
		
		// Display their friends
		const friends = store.each($rdf.sym(person), FOAF('knows'));
		$('#friends').empty();
		friends.forEach(async (friend) => {
			console.log(friend);
			if (friend.termType == "NamedNode") {
				await fetcher.load(friend);
				const fullName = store.any(friend, FOAF('name'));
				const s = "<a href=" + friend.uri + " target=_blank>" + friend.uri + "</a>";
				$('#friends').append(
					$('<li>').append("" + (fullName && (fullName.value || friend.value)) + " " + s));
			}
		});
	});
};
display();

$('#add').click(function() {
	solid.auth.trackSession(async session => {
		if (!session) {
			alert("log in or register on Solid");
			return;
		}
			
		const myid = session.webId;
		console.log(myid);
		
		// Set up a local data store and associated data fetcher
		const store = $rdf.graph();
		const fetcher = new $rdf.Fetcher(store);
		const updater = new $rdf.UpdateManager(store);
		
		// friend
		const friend = $('#friend').val();
		
		const me = $rdf.sym(myid);
		const profile = me.doc();
		console.log("My WedID: " + myid);
		
	//	store.add(me, VCARD('fn'), "test", profile);
	// "https://taisukef.solid.community/profile/card#me" n:fn "test1", "test2".
	
		let ins = $rdf.st(me, FOAF('knows'), $rdf.sym(friend), profile)
		let del = [];
		updater.update(del, ins, (uri, ok, message) => {
			console.log(uri);
			if (ok)
				console.log('ok');
			else
				alert(message);
		});
	});
});

$('#remove').click(function() {
	solid.auth.trackSession(async session => {
		// Set up a local data store and associated data fetcher
		const store = $rdf.graph();
		const fetcher = new $rdf.Fetcher(store);
		const updater = new $rdf.UpdateManager(store);
		
		// friend
		const friend = $('#friend').val();
		if (friend.length == 0)
			return;
		console.log(friend);
		
		const myid = session.webId;
		console.log(myid);
		
		const me = $rdf.sym(myid);
		const profile = me.doc();
		console.log("My WedID: " + myid);
		
		// https://seilan0123.solid.community/profile/card#me
		let ins = [];
		let del = store.statementsMatching(me, FOAF('knows'), $rdf.sym(friend), profile);
//		let del = store.statementsMatching(me, FOAF('knows'), friend, profile);
//		let del = store.statementsMatching(me, FOAF('knows'), null, profile);
		updater.update(del, ins, (uri, ok, message) => {
			if (ok)
				console.log('ok');
			else
				alert(message);
		});
	});
});
