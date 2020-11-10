package ru.capjack.tool.cpd.sites

import org.apache.commons.codec.digest.DigestUtils
import ru.capjack.tool.cpd.AccountIdentifier

class MmAccountIdentifier(
	private val secretKey: String
) : AccountIdentifier {
	
	override fun identify(query: String): String {
		val (sig, vid, params) = query.split('-', limit = 3)
		
		if (sig != DigestUtils.md5Hex(params + secretKey)) {
			throw IllegalArgumentException("Query verification failed")
		}
		
		return vid
	}
}