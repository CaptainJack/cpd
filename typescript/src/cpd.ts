module capjack.tool.cpd {
	export enum ProfileSite {
		NO,
		OK,
		VK,
		MM,
		YA,
		FB
	}
	
	export interface CpdState {
		readonly key: string
		readonly profileSite: ProfileSite
		readonly profileSiteApi: any
	}
	
	export class Config {
		public vkApiVersion: string = "5.124";
		public mmPrivateKey: string = "";
	}
	
	export function init(config?: Config): Promise<CpdState> {
		const c = config || new Config();
		
		return new Promise((resolve, reject) => {
			
			if (!window.cc) {
				throw Error("CPD available only in conjunction with Cocos")
			}
			
			const sys = cc.sys;
			const identity = new Identity();
			
			if (sys.isBrowser) {
				const query = extractQueryParameters(location.search);
				identity.profileSite = defineBrowserProfileSite(location.host, query);
				
				if (identity.profileSite == ProfileSite.NO) {
					identity.profileId = getGeneratedProfileId(sys);
				}
				else {
					includeScript(getProfileSiteScriptUrl(identity.profileSite))
						.catch(reject)
						.then(() => {
							initProfileSiteApi(identity, query, c)
								.catch(reject)
								.then(() => {
									resolve(identity.toState())
								})
						})
				}
			}
			else {
				identity.profileSite = ProfileSite.NO;
				identity.profileId = getGeneratedProfileId(sys);
				
				resolve(identity.toState())
			}
		});
	}
	
	function getProfileSiteScriptUrl(ps: ProfileSite) {
		switch (ps) {
			case ProfileSite.OK:
				return "//api.ok.ru/js/fapi5.js";
			case ProfileSite.VK:
				return "//vk.com/js/api/xd_connection.js?2";
			case ProfileSite.MM:
				return "//connect.mail.ru/js/loader.js";
			case ProfileSite.YA:
				return "//yandex.ru/games/sdk/v2";
			case ProfileSite.FB:
				throw Error("TODO");
			default:
				throw Error(`Unsupported profile site '${ps}'`)
		}
	}
	
	function initProfileSiteApi(identity: Identity, query: Query, config: Config): Promise<void> {
		switch (identity.profileSite) {
			case ProfileSite.OK:
				return initOk(identity, query);
			case ProfileSite.VK:
				return initVk(identity, query, config);
			case ProfileSite.MM:
				return initMm(identity, query, config);
			case ProfileSite.YA:
				return initYa();
			case ProfileSite.FB:
				return initFb();
			default:
				throw Error(`Unsupported profile site '${identity.profileSite}'`)
		}
	}
	
	function initOk(identity: Identity, query: Query): Promise<void> {
		return new Promise((resolve, reject) => {
			FAPI.init(query.api_server, query.apiconnection,
				() => {
					identity.profileId = `${query.auth_sig}-${query.logged_user_id}-${query.session_key}`;
					identity.profileSiteApi = FAPI;
					resolve();
				},
				reject
			)
		});
	}
	
	function initVk(identity: Identity, query: Query, config: Config): Promise<void> {
		return new Promise((resolve, reject) => {
			VK.init(
				() => {
					identity.profileId = `${query.auth_key}-${query.api_id}-${query.viewer_id}`;
					identity.profileSiteApi = VK;
					resolve();
				},
				() => {
					reject(new Error("VK api initialization failed"));
				},
				config.vkApiVersion
			);
		});
	}
	
	function initMm(identity: Identity, query: Query, config: Config): Promise<void> {
		return new Promise((resolve, reject) => {
			mailru.loader.require('api', function () {
				let s = false;
				try {
					mailru.app.init(config.mmPrivateKey);
					s = true
				}
				catch (e) {
					reject(new Error("MailRu api initialization failed"));
				}
				
				if (s) {
					let keys = Object.keys(query).sort();
					let p = `${query.sig}-${query.vid}-`;
					for (const key of keys) {
						p += key + '=' + query[key];
					}
					identity.profileId = p;
					identity.profileSiteApi = mailru;
					resolve()
				}
			});
		});
	}
	
	function initYa(): Promise<void> {
		throw Error("TODO");
	}
	
	function initFb(): Promise<void> {
		throw Error("TODO");
	}
	
	function includeScript(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const h = document.getElementsByName("head")[0];
			const s = document.createElement("script");
			s.src = url;
			s.async = true;
			s.onload = () => resolve();
			s.onerror = () => reject();
			h.appendChild(s)
		})
	}
	
	function getGeneratedProfileId(sys: typeof cc.sys) {
		const k = "cjt-cpd-profileId";
		let profileId = sys.localStorage[k];
		if (profileId == undefined) {
			const s = [];
			let values = crypto.getRandomValues(new Uint8Array(64));
			for (let i = 0, l = values.length; i < l; ++i) {
				let v = values[i];
				s.push((v & 15).toString(16));
			}
			profileId = s.join("");
			sys.localStorage[k] = profileId;
		}
		return profileId;
	}
	
	function defineBrowserProfileSite(host: string, query: Query): ProfileSite {
		if (query.logged_user_id) return ProfileSite.OK;
		if (query.viewer_id) return ProfileSite.VK;
		if (query.vid) return ProfileSite.MM;
		if (host.indexOf("yandex.ru") >= 0) return ProfileSite.YA;
		
		return ProfileSite.NO
	}
	
	function extractQueryParameters(query: string): Query {
		if (query.charAt(0) === '?') query = query.substring(1);
		const result: Query = {};
		
		for (const e of query.split('&')) {
			let i = e.indexOf('=');
			const k = decodeURIComponent(i > 0 ? e.substring(0, i) : e);
			result[k] = i > 0 && e.length > i + 1 ? decodeURIComponent(e.substring(i + 1)) : "";
		}
		
		return result
	}
	
	class Identity {
		public profileSiteApi: any = null;
		public profileSite: ProfileSite = ProfileSite.NO;
		public profileId: string = "undefined";
		
		toState(): CpdState {
			const k = [
				this.getProfileSiteKey(),
				this.profileId
			];
			
			return {
				key: k.join(''),
				profileSite: this.profileSite,
				profileSiteApi: this.profileSiteApi
			};
		}
		
		private getProfileSiteKey() {
			switch (this.profileSite) {
				case ProfileSite.NO:
					return "no";
				case ProfileSite.OK:
					return "ok";
				case ProfileSite.VK:
					return "vk";
				case ProfileSite.MM:
					return "mm";
				case ProfileSite.FB:
					return "fb";
				case ProfileSite.YA:
					return "ya";
				default:
					throw new Event(`Undefined site '${this.profileSite}'`);
			}
		}
	}
	
	interface Query {
		[key: string]: string
	}
}