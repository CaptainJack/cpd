package ru.capjack.tool.cpd.sites

import org.apache.commons.codec.digest.DigestUtils
import ru.capjack.tool.cpd.ClientProfileIdentifier

class VkClientProfileIdentifier(
	private val secretKey: String
) : ClientProfileIdentifier {
	
	override fun identify(query: String): String {
		val (authKey, apiId, viewerId) = query.split('-', limit = 3)
		
		if (authKey != DigestUtils.md5Hex(apiId + viewerId + secretKey)) {
			throw IllegalArgumentException("Query verification failed")
		}
		
		return viewerId
	}
}