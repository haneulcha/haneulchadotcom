import React, { useEffect, useContext } from "react"
import PropTypes from "prop-types"
import styled from "styled-components"
import Img from "gatsby-image"
import { MDXRenderer } from "gatsby-plugin-mdx"
import { motion, useAnimation } from "framer-motion"

import Context from "../../context/"
import ContentWrapper from "../../styles/contentWrapper"
import Underlining from "../../styles/underlining"
import Social from "../social"
import SplashScreen from "../splashScreen"
import { lightTheme, darkTheme } from "../../styles/theme"

const StyledSection = styled.section`
  width: 100%;
  height: auto;
  background: transparent;
`

const StyledContentWrapper = styled(ContentWrapper)`
  && {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: 6rem;
    @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
      margin-bottom: 4rem;
    }
    .greetings {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-top: 3rem;
    }
    .emoji {
      margin-left: 0.5rem;
      width: 2.2rem;
      height: 2.2rem;
      @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
        margin-left: 0.7rem;
        width: 3rem;
        height: 3rem;
      }
    }
    .emoji:hover {
    }
    .title {
      margin-bottom: 1.5rem;
      font-color: ${({ theme }) => theme.colors.primary};
      @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
        margin: 0.5rem 0;
      }
    }
    .subtitle {
      margin-top: -0.75rem;
      margin-bottom: 2rem;
    }
    .description {
      font-size: 1.125rem;
      margin-bottom: 2rem;
    }
    .hero-img {
      position: absolute;
      top: 15vh;
      right: 2.5rem;
      width: 20rem;
      height: 20rem;
      z-index: -1;
      & .bg {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        & .code {
          height: 100%;
        }
      }
      & .me {
        display: block;
        width: 10rem;
        margin: auto;
        padding-top: 7rem;
        filter: drop-shadow(0px 3px 5px ${({ theme }) => theme.colors.text});
        z-index: 0;
        & .me-happy {
          display: none;
          width: 185%;
          bottom: 4rem;
        }
      }
      // &:hover {
      //   z-index: 100;
      //   & .me .me-sad {
      //     display: none;
      //   }
      //   & .me .me-happy {
      //     display: block;
      //   }
      // }
    }
  }
`

const AnimatedUnderlining = motion.custom(Underlining)

const Hero = ({ content }) => {
  const { frontmatter, body } = content[0].node
  const { isIntroDone, darkMode } = useContext(Context).state

  // Controls to orchestrate animations of greetings, emoji, social profiles, underlining
  const gControls = useAnimation()
  const eControls = useAnimation()
  const sControls = useAnimation()
  const uControls = useAnimation()

  // Start Animations after the splashScreen sequence is done
  useEffect(() => {
    const pageLoadSequence = async () => {
      if (isIntroDone) {
        eControls.start({
          rotate: [0, -10, 12, -10, 9, 0, 0, 0, 0, 0, 0],
          transition: { duration: 2.5, loop: 3, repeatDelay: 1 },
        })
        await gControls.start({
          opacity: 1,
          y: 0,
          transition: { delay: 0.4 },
        })
        await sControls.start({
          opacity: 1,
          x: 0,
        })
        // Animate underlining to hover state
        await uControls.start({
          boxShadow: `inset 0 -2rem 0 ${
            darkMode ? darkTheme.colors.secondary : lightTheme.colors.secondary
          }`,
          transition: { delay: 0.4, ease: "circOut" },
        })
      }
    }
    pageLoadSequence()
  }, [isIntroDone, darkMode, eControls, gControls, sControls, uControls])

  return (
    <StyledSection id="hero">
      {!isIntroDone && <SplashScreen />}

      <StyledContentWrapper>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={gControls}>
          <h1 className="title">
            <div className="greetings">
              {frontmatter.greetings}
              <motion.div
                animate={eControls}
                style={{ originX: 0.7, originY: 0.7 }}
              >
                <Img
                  className="emoji"
                  fluid={frontmatter.icon.childImageSharp.fluid}
                />
              </motion.div>
            </div>
          </h1>
          <h1 className="title">
            <AnimatedUnderlining animate={uControls} big>
              {frontmatter.title}
            </AnimatedUnderlining>
          </h1>
          <h3 className="subtitle">
            {frontmatter.subtitlePrefix} {frontmatter.subtitle}
          </h3>
          <div className="description">
            <MDXRenderer>{body}</MDXRenderer>
          </div>
          <div className="hero-img">
            <div className="bg">
              <Img
                className="code"
                fluid={frontmatter.bg.childImageSharp.fluid}
              />
            </div>

            <div className="me">
              <Img
                className="me-sad"
                fluid={frontmatter.me.childImageSharp.fluid}
              />
              <Img
                className="me-happy"
                fluid={frontmatter.mehappy.childImageSharp.fluid}
              />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={sControls}>
          <Social fontSize="1rem" padding=".5rem 1.25rem" width="auto" />
        </motion.div>
      </StyledContentWrapper>
    </StyledSection>
  )
}

Hero.propTypes = {
  content: PropTypes.arrayOf(
    PropTypes.shape({
      node: PropTypes.shape({
        body: PropTypes.string.isRequired,
        frontmatter: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired
  ).isRequired,
}

export default Hero
