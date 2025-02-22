import _ from "lodash";
import saveAs from "file-saver";
import tv4 from "tv4";
import userSettingsSchema from "../schemas/user-settings-schema.json";

function buildJSON(providers, githubConfig, redirectUri) {
	const json = {
		providers: _.map(providers, p => ({
			...p, lastUpdated: null, data: null
		}) ),
		githubConfig, redirectUri
	};
	return JSON.stringify(json, null, 2);

}

function download(providers, githubConfig, redirectUri, fileName="talkhealth-settings.json") {
	const json = buildJSON(providers, githubConfig, redirectUri);
	const blob = new Blob(
		[json], 
		{type: "application/json;charset=utf-8"}
	);
    saveAs(blob, fileName);
}

function readFromFile(file, redirectUri, queryProfiles) {
	const reader = new FileReader();
	return new Promise( (resolve, reject) => {	
		reader.onload = e => resolve(reader.result);
		reader.onerror = e => reject(e);
		reader.readAsText(file);
	})
	.then( data => {
		try {
			return JSON.parse(data);
		} catch (e) {
			throw new Error("Unable to read file")
		}
	})
	.then( json => {
		if (json.redirectUri !== redirectUri)
			throw new Error("Only settings saved from this website can be imported")
		return json;

	})
	.then( json => {
		tv4.validate(json, userSettingsSchema);
		if (tv4.error) {
			if (console) console.log(tv4.error);
			throw new Error("Invalid file format: " + tv4.error.message);
		}
		return json;

	})
	.then( json => {
		_.each( json.providers, provider => {
			if (!queryProfiles[provider.queryProfile]) 
				throw new Error(
					"Query profile not found: " + provider.queryProfile
				);
		});
		return json;
	})
}

export default { 
	buildJSON, download, readFromFile 
}