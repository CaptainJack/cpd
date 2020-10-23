declare namespace FAPI {
	function init(apiServer: string, apiConnection: string, onSuccess: () => void, onError: (error: any) => void);
}

declare namespace VK {
	function init(onSuccess: () => void, onFail: () => void, apiVersion: string)
}

declare namespace mailru {
	namespace loader {
		function require(module: string, onReady: () => void)
	}
	
	namespace app {
		function init(c: string)
	}
}

declare namespace YaGames {
	function init(options?: {}): Promise<ysdk>
}