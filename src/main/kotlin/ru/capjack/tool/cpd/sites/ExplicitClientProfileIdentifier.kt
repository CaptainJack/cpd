package ru.capjack.tool.cpd.sites

import ru.capjack.tool.cpd.ClientProfileIdentifier

class ExplicitClientProfileIdentifier : ClientProfileIdentifier {
	override fun identify(query: String): String {
		return query
	}
}