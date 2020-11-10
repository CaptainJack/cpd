module capjack.tool.cpd {
	export enum AccountSite {
		NO,
		OK,
		VK,
		MM,
		YA,
		FB
	}
	
	export interface CpdState {
		readonly key: string
		readonly site: AccountSite
		readonly siteApi: any
	}
	
	export class Config {
		public vkApiVersion: string = "5.124";
		public mmPrivateKey: string = "";
	}
	
	export function init(project: string, config?: Config): Promise<CpdState> {
		const c = config || new Config();
		
		return new Promise((resolve, reject) => {
			
			if (!window.cc) {
				throw Error("CPD available only in conjunction with Cocos")
			}
			
			const sys = cc.sys;
			const identity = new Identity();
			
			if (sys.isBrowser) {
				const query = extractQueryParameters(location.search);
				identity.site = defineBrowserSite(location.host, query);
				
				if (identity.site == AccountSite.NO) {
					identity.id = getGeneratedId(project, sys);
					resolve(identity.toState())
				}
				else {
					includeScript(getSiteScriptUrl(identity.site))
						.catch(reject)
						.then(() => {
							initSiteApi(identity, query, c)
								.catch(reject)
								.then(() => {
									resolve(identity.toState())
								})
						})
				}
			}
			else {
				identity.site = AccountSite.NO;
				identity.id = getGeneratedId(project, sys);
				
				resolve(identity.toState())
			}
		});
	}
	
	function getSiteScriptUrl(ps: AccountSite) {
		switch (ps) {
			case AccountSite.OK:
				return "//api.ok.ru/js/fapi5.js";
			case AccountSite.VK:
				return "//vk.com/js/api/xd_connection.js?2";
			case AccountSite.MM:
				return "//connect.mail.ru/js/loader.js";
			case AccountSite.YA:
				return "//yandex.ru/games/sdk/v2";
			case AccountSite.FB:
				throw Error("TODO");
			default:
				throw Error(`Unsupported profile site '${ps}'`)
		}
	}
	
	function initSiteApi(identity: Identity, query: Query, config: Config): Promise<void> {
		switch (identity.site) {
			case AccountSite.OK:
				return initOk(identity, query);
			case AccountSite.VK:
				return initVk(identity, query, config);
			case AccountSite.MM:
				return initMm(identity, query, config);
			case AccountSite.YA:
				return initYa();
			case AccountSite.FB:
				return initFb();
			default:
				throw Error(`Unsupported profile site '${identity.site}'`)
		}
	}
	
	function initOk(identity: Identity, query: Query): Promise<void> {
		return new Promise((resolve, reject) => {
			FAPI.init(query.api_server, query.apiconnection,
				() => {
					identity.id = `${query.auth_sig}-${query.logged_user_id}-${query.session_key}`;
					identity.siteApi = FAPI;
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
					identity.id = `${query.auth_key}-${query.api_id}-${query.viewer_id}`;
					identity.siteApi = VK;
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
					identity.id = p;
					identity.siteApi = mailru;
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
	
	function getGeneratedId(project: string, sys: typeof cc.sys) {
		const k = `cjt-cpd-${project}`;
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
	
	function defineBrowserSite(host: string, query: Query): AccountSite {
		if (query.logged_user_id) return AccountSite.OK;
		if (query.viewer_id) return AccountSite.VK;
		if (query.vid) return AccountSite.MM;
		if (host.indexOf("yandex.ru") >= 0) return AccountSite.YA;
		
		return AccountSite.NO
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
		public siteApi: any = null;
		public site: AccountSite = AccountSite.NO;
		public id: string = "undefined";
		
		toState(): CpdState {
			const k = [
				this.getSiteKey(),
				this.id
			];
			
			return {
				key: k.join(''),
				site: this.site,
				siteApi: this.siteApi
			};
		}
		
		private getSiteKey() {
			switch (this.site) {
				case AccountSite.NO:
					return "no";
				case AccountSite.OK:
					return "ok";
				case AccountSite.VK:
					return "vk";
				case AccountSite.MM:
					return "mm";
				case AccountSite.FB:
					return "fb";
				case AccountSite.YA:
					return "ya";
				default:
					throw new Event(`Undefined site '${this.site}'`);
			}
		}
	}
	
	interface Query {
		[key: string]: string
	}
}