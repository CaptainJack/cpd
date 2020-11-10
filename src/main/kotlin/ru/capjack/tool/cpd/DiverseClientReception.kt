package ru.capjack.tool.cpd

open class DiverseClientReception() : ClientReception {
	
	private val accountIdentifiers = mutableMapOf<AccountSite, AccountIdentifier>()
	
	fun bindAccountIdentifier(site: AccountSite, identifier: AccountIdentifier) {
		accountIdentifiers[site] = identifier
	}
	
	override fun identify(key: String): ClientIdentity {
		try {
			require(key.length >= 3)
			
			val keyAccountSite = key.substring(0, 2)
			val keyAccountId = key.substring(2)
			
			val accountSite = when (keyAccountSite) {
				"no" -> AccountSite.NO
				"ok" -> AccountSite.OK
				"vk" -> AccountSite.VK
				"mm" -> AccountSite.MM
				"fb" -> AccountSite.FB
				"ya" -> AccountSite.YA
				else -> throw IllegalArgumentException("Indefinable device stage '$keyAccountSite'")
			}
			
			val identifier = accountIdentifiers[accountSite]
				?: throw IllegalStateException("Unsupported profile site '$accountSite'")
			
			val accountId: String = identifier.identify(keyAccountId)
			
			return ClientIdentity(accountSite, accountId)
		}
		catch (e: Throwable) {
			throw IllegalArgumentException("Invalid key '$key'", e)
		}
	}
}