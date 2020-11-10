package ru.capjack.tool.cpd.sites

import org.apache.commons.codec.digest.DigestUtils
import ru.capjack.tool.cpd.AccountIdentifier

class VkAccountIdentifier(
	private val secretKey: String
) : AccountIdentifier {
	
	override fun identify(query: String): String {
		val (authKey, apiId, viewerId) = query.split('-', limit = 3)
		
		if (authKey != DigestUtils.md5Hex(apiId + viewerId + secretKey)) {
			throw IllegalArgumentException("Query verification failed")
		}
		
		return viewerId
	}
}