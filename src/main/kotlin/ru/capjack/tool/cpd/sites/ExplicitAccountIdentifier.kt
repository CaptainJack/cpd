package ru.capjack.tool.cpd.sites

import ru.capjack.tool.cpd.AccountIdentifier

class ExplicitAccountIdentifier : AccountIdentifier {
	override fun identify(query: String): String {
		return query
	}
}