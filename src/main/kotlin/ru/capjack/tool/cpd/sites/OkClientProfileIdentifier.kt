package ru.capjack.tool.cpd.sites

import org.apache.commons.codec.digest.DigestUtils
import ru.capjack.tool.cpd.ClientProfileIdentifier

class OkClientProfileIdentifier(
	private val secretKey: String
) : ClientProfileIdentifier {
	
	override fun identify(query: String): String {
		val (authSig, loggedUserId, sessionKey) = query.split('-', limit = 3)
		
		if (authSig != DigestUtils.md5Hex(loggedUserId + sessionKey + secretKey)) {
			throw IllegalArgumentException("Query verification failed")
		}
		
		return loggedUserId
	}
}

