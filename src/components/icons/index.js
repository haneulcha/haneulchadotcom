import React from "react"

import IconNotion from "./notion"
import IconLinkedIn from "./linkedin"
import IconMedium from "./medium"
import IconGitHub from "./github"
import IconBehance from "./behance"
import IconExternal from "./external"

// Utility function to grab Icons by name
const Icon = ({ name, color }) => {
  switch (name.toLowerCase()) {
    case "notion":
      return <IconNotion color={color} />
    case "linkedin":
      return <IconLinkedIn color={color} />
    case "medium":
      return <IconMedium color={color} />
    case "github":
      return <IconGitHub color={color} />
    case "behance":
      return <IconBehance color={color} />
    case "external":
      return <IconExternal color={color} />
    default:
      return null
  }
}

export default Icon
