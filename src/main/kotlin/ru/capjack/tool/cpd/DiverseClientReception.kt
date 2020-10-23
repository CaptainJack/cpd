package ru.capjack.tool.cpd

class DiverseClientReception() : ClientReception {
	
	private val profileIdentifiers = mutableMapOf<ClientProfileSite, ClientProfileIdentifier>()
	
	fun bindProfileIdentifier(site: ClientProfileSite, identifier: ClientProfileIdentifier) {
		profileIdentifiers[site] = identifier
	}
	
	override fun identify(key: String): ClientIdentity {
		try {
			require(key.length >= 3)
			
			val keyProfileSite = key.substring(0, 2)
			val keyProfileId = key.substring(2)
			
			val profileSite = when (keyProfileSite) {
				"no" -> ClientProfileSite.NO
				"ok" -> ClientProfileSite.OK
				"vk" -> ClientProfileSite.VK
				"mm" -> ClientProfileSite.MM
				"fb" -> ClientProfileSite.FB
				"ya" -> ClientProfileSite.YA
				else -> throw IllegalArgumentException("Indefinable device stage '$keyProfileSite'")
			}
			
			val identifier = profileIdentifiers[profileSite]
				?: throw IllegalStateException("Unsupported profile site '$profileSite'")
			
			val profileId: String = identifier.identify(keyProfileId)
			
			return ClientIdentity(profileSite, profileId)
		}
		catch (e: Throwable) {
			throw IllegalArgumentException("Invalid key '$key'", e)
		}
	}
}