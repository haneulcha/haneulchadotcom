import React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

const Resume = () => {
  const pdfFile = useStaticQuery(graphql`
    {
      pdf: file(name: { eq: "haneulcha_resume_kor" }) {
        name
        extension
        publicURL
      }
    }
  `)

  return (
    <a href={pdfFile.pdf.publicURL} target="_blank" rel="noreferrer" download>
      이력서 / CV (Kor)
    </a>
  )
}

export default Resume

Resume.propTypes = {
  name: PropTypes.string,
  extension: PropTypes.string,
  publicURL: PropTypes.string,
}
